package com.airdnd.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Getter
@Entity
@Table(name = "members")
@AllArgsConstructor
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotNull
    @Column(unique = true)
    private String email;
    @NotNull
    private String nickname;
    @NotNull
    @Enumerated(EnumType.STRING)
    private MemberRoles role;
    @NotNull
    private String oauthProvider;
    @NotNull
    private String oauthId;
    @NotNull
    private boolean isDeleted;


    public void activateHost(){
        if(this.role == MemberRoles.GUEST){
            this.role = MemberRoles.HOST;
        }
    }
}
